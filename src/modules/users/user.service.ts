import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { LoggerService } from 'src/common/logger/logger.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserStatus } from 'src/common/interfaces/user.interface';
import { Subscription } from '../subscription/subscription.entity';
import {
  SubscriptionMethod,
  SubscriptionStatus,
} from 'src/common/interfaces/subscription.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: LoggerService, // Assuming you have a logger service
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(userDto: CreateUserDto): Promise<User> {
    return await this.entityManager.transaction(async (manager) => {
      const existingUser = await manager.findOne(User, {
        where: { email: userDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      if (userDto.password) {
        userDto.password = await bcrypt.hash(userDto.password, 10);
      }

      const newUser = manager.create(User, userDto);
      const savedUser = await manager.save(User, newUser);

      const subscription = manager.create(Subscription, {
        user: savedUser,
        status: SubscriptionStatus.INACTIVE,
        subscriptionMethod: SubscriptionMethod.BANK_TRANSFER,
      });

      await manager.save(Subscription, subscription);

      return savedUser;
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filter?: { status?: UserStatus },
  ) {
    const query = this.userRepository.createQueryBuilder('user');

    if (filter?.status) {
      query.andWhere('user.status = :status', { status: filter.status });
    }

    query.skip((page - 1) * limit).take(limit);

    const [users, total] = await query.getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // This includes the password in the result
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // This includes the password in the result
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return await this.findById(id);
  }

  async delete(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.userRepository.remove(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword; // Assume password is already hashed
    return await this.userRepository.save(user);
  }

  async changePassword(
    id: string,
    {
      oldPassword,
      confirmPassword,
      newPassword,
    }: {
      oldPassword: string;
      confirmPassword: string;
      newPassword: string;
    },
  ): Promise<{
    ok: boolean;
    message: string;
    data: User | null;
  }> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException({
        ok: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        {
          ok: false,
          message: 'Old password is incorrect',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (newPassword !== confirmPassword) {
      throw new ConflictException({
        ok: false,
        message: 'New password and confirm password do not match',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    // return await this.userRepository.save(user);
    return {
      ok: true,
      message: 'Password updated successfully',
      data: await this.userRepository.save(user),
    };
  }
}

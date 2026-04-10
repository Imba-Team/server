import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { LoggerService } from 'src/common/logger/logger.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserStatus } from 'src/common/interfaces/user.interface';
import { slugify } from 'src/common/utils/sligify';
import { Role } from 'src/common/decorators/roles.decorator';

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

      const username = await this.allocateUsername(
        manager,
        userDto.name || userDto.email,
      );

      const hashed = userDto.password
        ? await bcrypt.hash(userDto.password, 10)
        : userDto.password;

      const newUser = manager.create(User, {
        email: userDto.email,
        username,
        password: hashed,
        status: userDto.status ?? 'active',
        role: userDto.role ?? Role.USER,
      });
      return manager.save(User, newUser);
    });
  }

  private async allocateUsername(
    manager: EntityManager,
    baseInput: string,
    excludeUserId?: string,
  ): Promise<string> {
    const base =
      slugify(
        baseInput.includes('@') ? baseInput.split('@')[0] : baseInput,
        28,
      ) || 'user';
    let candidate = base;
    for (let i = 0; i < 10_000; i++) {
      const existing = await manager.findOne(User, {
        where: { username: candidate },
      });
      if (!existing || existing.id === excludeUserId) {
        return candidate;
      }
      candidate = `${base.slice(0, 18)}${i + 2}`;
    }
    return `${base}-${Date.now()}`;
  }

  /** Fills `username` for rows created before the username column existed */
  private async ensureUsernameBackfill(user: User): Promise<User> {
    if (user.username != null && user.username !== '') {
      return user;
    }
    const username = await this.allocateUsername(
      this.entityManager,
      user.legacyName || user.email,
      user.id,
    );
    await this.userRepository.update(user.id, {
      username,
      legacyName: null,
    });
    user.username = username;
    user.legacyName = null;
    return user;
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

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    if (!user) {
      return null;
    }
    return this.ensureUsernameBackfill(user);
  }

  async findById(id: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.ensureUsernameBackfill(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (updateUserDto.email !== undefined) user.email = updateUserDto.email;
    if (updateUserDto.name !== undefined) {
      user.username = await this.allocateUsername(
        this.entityManager,
        updateUserDto.name,
        id,
      );
    }
    if (updateUserDto.status !== undefined) user.status = updateUserDto.status;
    if (updateUserDto.role !== undefined) user.role = updateUserDto.role;
    if (updateUserDto.profilePicture !== undefined) {
      user.profilePicture = updateUserDto.profilePicture;
    }
    return this.userRepository.save(user);
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

import { User } from './entities/user.entity';
import { StudySet } from './entities/study-set.entity';
import { Flashcard } from './entities/flashcard.entity';
import { Comment } from './entities/comment.entity';
import { StudySession } from './entities/study-session.entity';
import { StudySetCollaborator } from './entities/study-set-collaborator.entity';
import { FavoriteStudySet } from './entities/favorite-study-set.entity';
import { Folder } from './entities/folder.entity';
import { FolderStudySet } from './entities/folder-study-set.entity';
import { FlashcardUserState } from './entities/flashcard-user-state.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { TestQuestionAttempt } from './entities/test-question-attempt.entity';
import { Tag } from './entities/tag.entity';
import { StudySetTag } from './entities/study-set-tag.entity';
import { MagicLink } from './entities/magic-link.entity';

export const PERSISTENCE_ENTITIES = [
  User,
  StudySet,
  Flashcard,
  Comment,
  StudySession,
  StudySetCollaborator,
  FavoriteStudySet,
  Folder,
  FolderStudySet,
  FlashcardUserState,
  TestAttempt,
  TestQuestionAttempt,
  Tag,
  StudySetTag,
  MagicLink,
] as const;

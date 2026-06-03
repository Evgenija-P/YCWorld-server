import {
  Injectable,
  ConflictException,
  OnModuleInit,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';
import { Company, CompanyDocument } from '../company/schemas/company.schema';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>,
  ) {}

  // ─── Ініціалізація — створення суперадміна при першому запуску ────────────
  async onModuleInit() {
    const adminExists = await this.userModel.findOne({
      role: UserRole.SUPERADMIN,
    });

    if (!adminExists) {
      let rootCompany = await this.companyModel.findOne({ code: 'root' });

      if (!rootCompany) {
        rootCompany = await this.companyModel.create({
          name: 'Root Company',
          code: 'root',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      await this.userModel.create({
        login: 'admin',
        fullName: 'Головний Адміністратор',
        passwordHash,
        role: UserRole.SUPERADMIN,
        mustChangePassword: true,
        companyId: rootCompany._id,
      });
    }
  }

  // ─── Хелпер: перевірка доступу до юзера ──────────────────────────────────
  // SUPERADMIN — бачить всіх
  // ADMIN — тільки свою компанію
  // USER — немає доступу (контролюється через @Roles на рівні контролера)
  private checkAccess(user: UserDocument, reqUser: AuthenticatedUser): void {
    if (reqUser.role === UserRole.SUPERADMIN) return;

    if (
      reqUser.role === UserRole.ADMIN &&
      user.companyId.toString() !== reqUser.companyId.toString()
    ) {
      throw new ForbiddenException('Немає доступу до цього користувача');
    }
  }

  // ─── Створення користувача ────────────────────────────────────────────────
  async create(createUserDto: CreateUserDto, reqUser: AuthenticatedUser) {
    const { login, password, fullName, role } = createUserDto;

    // ADMIN може створювати тільки USER
    if (reqUser.role === UserRole.ADMIN && role !== UserRole.USER) {
      throw new ForbiddenException(
        'Недостатньо прав. Адміністратор може створювати тільки користувачів з роллю USER',
      );
    }

    let companyId: Types.ObjectId;

    if (reqUser.role === UserRole.SUPERADMIN) {
      if (!createUserDto.companyId) {
        throw new Error('Company is required');
      }
      const company = await this.companyModel.findById(createUserDto.companyId);
      if (!company || company.code === 'root') {
        throw new Error('Invalid company');
      }
      companyId = company._id;
    } else {
      // ADMIN створює юзера у своїй компанії
      companyId = reqUser.companyId as unknown as Types.ObjectId;
    }

    const existingUser = await this.userModel.findOne({ login });
    if (existingUser) {
      throw new ConflictException('Користувач вже існує');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return this.userModel.create({
      login,
      fullName,
      passwordHash,
      role,
      mustChangePassword: true,
      companyId,
    });
  }

  // ─── Пошук ───────────────────────────────────────────────────────────────
  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ login }).exec();
  }

  async findById(id: string | Types.ObjectId) {
    return this.userModel.findById(id);
  }

  // SUPERADMIN — всі юзери, ADMIN — тільки своя компанія
  async findAllUsers(reqUser: AuthenticatedUser) {
    if (reqUser.role === UserRole.SUPERADMIN) {
      return this.userModel.find().select('-passwordHash').exec();
    }
    return this.userModel
      .find({ companyId: reqUser.companyId })
      .select('-passwordHash')
      .exec();
  }

  async findByCompany(companyId: string | Types.ObjectId) {
    return this.userModel.find({ companyId }).select('-passwordHash').exec();
  }

  async findUsersByCompany(companyId: string): Promise<User[]> {
    return this.userModel.find({ companyId });
  }

  // ─── Редагування ─────────────────────────────────────────────────────────
  async updateUser(
    userId: string,
    dto: { fullName?: string; role?: UserRole },
    reqUser: AuthenticatedUser,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    this.checkAccess(user, reqUser);

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.role) user.role = dto.role;

    await user.save();
    return user;
  }

  // ─── Блокування/розблокування ─────────────────────────────────────────────
  async toggleActive(userId: string, reqUser: AuthenticatedUser) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    this.checkAccess(user, reqUser);

    user.isActive = !user.isActive;
    await user.save();

    return { isActive: user.isActive };
  }

  // ─── Зміна паролю самим юзером ────────────────────────────────────────────
  async changePassword(
    userId: string,
    newPassword: string,
    companyId: string | Types.ObjectId,
  ) {
    const user = await this.userModel.findOne({ _id: userId, companyId });
    if (!user) throw new NotFoundException('User not found');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;

    await user.save();
    return { success: true };
  }

  // ─── Скидання паролю адміном ─────────────────────────────────────────────
  // SUPERADMIN — будь-якому юзеру
  // ADMIN — тільки юзерам своєї компанії
  async adminResetPassword(
    userId: string,
    newPassword: string,
    reqUser: AuthenticatedUser,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    this.checkAccess(user, reqUser);

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = true;

    await user.save();
    return { success: true };
  }

  // ─── Видалення ────────────────────────────────────────────────────────────
  async deleteUser(userId: string, reqUser: AuthenticatedUser) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Не можна видалити себе
    if (user._id.toString() === reqUser.id.toString()) {
      throw new ForbiddenException('Cannot delete yourself');
    }

    this.checkAccess(user, reqUser);

    await this.userModel.findByIdAndDelete(userId);
    return { success: true };
  }
}

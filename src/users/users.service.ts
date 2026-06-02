import { Injectable, ConflictException, OnModuleInit } from '@nestjs/common';
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

      console.log('Admin created', { login: 'admin', password: 'admin123' });
    }
  }

  async create(createUserDto: CreateUserDto, reqUser: AuthenticatedUser) {
    const { login, password, fullName, role } = createUserDto;

    // 🔒 ролі
    if (reqUser.role !== UserRole.SUPERADMIN && role !== UserRole.USER) {
      throw new Error('Недостатньо прав');
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

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ login }).exec();
  }

  async adminResetPassword(
    userId: string,
    newPassword: string,
    companyId: string | Types.ObjectId,
  ) {
    // const user = await this.userModel.findOne({
    //   _id: new Types.ObjectId(userId),
    //   companyId,
    // });

    // Тимчасово — шукаємо тільки по _id без companyId
    const user = await this.userModel.findById(userId);
    console.log('Found user:', user);
    if (!user) throw new Error('User not found');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = true;

    await user.save();

    return { success: true };
  }

  async changePassword(
    userId: string,
    newPassword: string,
    companyId: string | Types.ObjectId,
  ) {
    const user = await this.userModel.findOne({
      _id: userId,
      companyId,
    });

    if (!user) throw new Error('User not found');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;

    await user.save();

    return { success: true };
  }

  async resetPassword(
    userId: string,
    newPassword: string,
    companyId: string | Types.ObjectId,
  ) {
    const user = await this.userModel.findOne({
      _id: userId,
      companyId,
    });

    if (!user) throw new Error('User not found');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = true;

    await user.save();

    return { success: true };
  }

  async findAllUsers() {
    return this.userModel.find().select('-passwordHash').exec();
  }

  async findByCompany(companyId: string | Types.ObjectId) {
    return this.userModel.find({ companyId }).select('-passwordHash').exec();
  }

  async updateUser(
    userId: string,
    dto: { fullName?: string; role?: UserRole },
    reqUser: AuthenticatedUser,
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new Error('User not found');

    // 🔒 ADMIN — тільки своя компанія
    if (
      reqUser.role === UserRole.ADMIN &&
      user.companyId.toString() !== reqUser.companyId.toString()
    ) {
      throw new Error('Немає доступу');
    }

    // 🔒 SUPERADMIN може все
    // (але можна обмежити root якщо треба)

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.role) user.role = dto.role;

    await user.save();

    return user;
  }

  async toggleActive(userId: string, reqUser: AuthenticatedUser) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new Error('User not found');

    // 🔒 ADMIN — тільки своя компанія
    if (
      reqUser.role === UserRole.ADMIN &&
      user.companyId.toString() !== reqUser.companyId.toString()
    ) {
      throw new Error('Немає доступу');
    }

    user.isActive = !user.isActive;

    await user.save();

    return { isActive: user.isActive };
  }

  async findById(id: string | Types.ObjectId) {
    return this.userModel.findById(id);
  }

  async findUsersByCompany(companyId: string): Promise<User[]> {
    return this.userModel.find({ companyId });
  }
}

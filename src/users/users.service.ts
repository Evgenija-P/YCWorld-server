import { Injectable, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async onModuleInit() {
    const adminExists = await this.userModel
      .findOne({ role: UserRole.SUPERADMIN })
      .exec();

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      await this.userModel.create({
        login: 'superadmin',
        fullName: 'Головний Адміністратор',
        passwordHash,
        role: UserRole.SUPERADMIN,
        mustChangePassword: true,
        companyId: 'root',
      });

      console.log(
        '--- DEFAULT ADMIN CREATED: admin / admin123 / company "root" ---',
      );
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { login, password, fullName, role, companyId } = createUserDto;

    const existingUser = await this.userModel.findOne({ login }).exec();

    if (existingUser) {
      throw new ConflictException('Користувач з таким логіном вже існує');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new this.userModel({
      login,
      fullName,
      passwordHash,
      role,
      mustChangePassword: true,
      companyId,
    });

    return newUser.save();
  }

  async findByLogin(
    login: string,
    companyId: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ login, companyId }).exec();
  }

  async adminResetPassword(
    userId: string,
    newPassword: string,
    companyId: string,
  ) {
    const user = await this.userModel.findOne({ _id: userId, companyId });

    if (!user) throw new Error('User not found');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // ❗ форсимо зміну
    user.mustChangePassword = true;

    await user.save();

    return { success: true };
  }

  async changePassword(userId: string, newPassword: string, companyId: string) {
    const user = await this.userModel.findOne({ _id: userId, companyId });

    if (!user) throw new Error('User not found');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // ❗ знімаємо форс
    user.mustChangePassword = false;

    await user.save();

    return { success: true };
  }

  async resetPassword(userId: string, newPassword: string, companyId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      companyId,
    });

    if (!user) {
      throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    user.mustChangePassword = true;

    await user.save();

    return { success: true };
  }
}

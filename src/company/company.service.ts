import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { nanoid } from 'nanoid';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    const exists = await this.companyModel.findOne({ code: 'root' });

    if (!exists) {
      await this.companyModel.create({
        name: 'Root Company',
        code: 'root',
      });
    }
  }

  async generateCode(): Promise<string> {
    let code: string;

    do {
      code = `comp${Math.floor(100000 + Math.random() * 900000)}`;
    } while (await this.companyModel.findOne({ code }));

    return code;
  }

  async create(name: string) {
    const exists = await this.companyModel.findOne({ name });

    if (exists) {
      throw new ConflictException('Компанія вже існує');
    }

    // const code = await this.generateCode();
    const code = `comp_${nanoid(6)}`;

    return this.companyModel.create({ name, code });
  }

  async findAll() {
    return this.companyModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    return this.companyModel.findById(id);
  }

  async remove(id: string) {
    const company = await this.companyModel.findById(id);

    if (!company) {
      throw new NotFoundException('Компанію не знайдена');
    }

    if (company.code === 'root') {
      throw new BadRequestException('Не можливо видалити root компанію');
    }

    const usersCount = await this.userModel.countDocuments({
      companyId: company._id,
    });

    if (usersCount > 0) {
      throw new BadRequestException('У компанії є користувачі');
    }

    return this.companyModel.findByIdAndDelete(id);
  }

  async update(id: string, name: string) {
    const exists = await this.companyModel.findOne({ name });

    if (exists && exists._id.toString() !== id) {
      throw new ConflictException('Компанія вже існує');
    }

    return this.companyModel.findByIdAndUpdate(
      id,
      { name },
      { returnDocument: 'after' },
    );
  }
}

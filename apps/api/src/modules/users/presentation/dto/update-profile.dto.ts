import { Transform } from "class-transformer";
import {
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpdateProfileDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsInt()
  @Min(0)
  version!: number;
}

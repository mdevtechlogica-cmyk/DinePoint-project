import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
  } from 'class-validator';
  
  export class UpdateTableDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    tableNumber?: number;
  
    @IsOptional()
    @IsInt()
    @Min(1)
    seats?: number;
  
    @IsOptional()
    @IsInt()
    @Min(1)
    floorNumber?: number;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    roomName?: string;
  
    @IsOptional()
    @IsBoolean()
    isAc?: boolean;
  
    @IsOptional()
    @IsBoolean()
    isFamilyFriendly?: boolean;
  
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
  }
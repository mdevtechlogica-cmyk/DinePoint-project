import {
    IsBoolean,
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
  } from 'class-validator';
  
  export class UpdateRestaurantDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    restaurantName?: string;
  
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    branchName?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
  
    @IsOptional()
    @IsEmail()
    @MaxLength(254)
    email?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(200)
    addressLine1?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(200)
    addressLine2?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    area?: string;
  
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    city?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(20)
    postalCode?: string;
  }
  
  export class SetRestaurantPublishedDto {
    @IsBoolean()
    isPublished!: boolean;
  }
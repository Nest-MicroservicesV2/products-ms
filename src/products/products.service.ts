import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  onModuleInit() {
    this.$connect();
    this.logger.log('Database connect')
  }

  private readonly logger = new Logger('Product Service')
  async create(createProductDto: CreateProductDto) {
    try {
      return await this.product.create({
        data: createProductDto
      })  
    } catch (error) {
      throw new Error('Error creating products: ' + error.messages);
    }
    
  }

  async findAll(paginationDto : PaginationDto) {
    const {page, limit} = paginationDto;
    const totalPage = await this.product.count({where : {available: true}});
    const lastPage = await Math.ceil(totalPage/limit);
    
    try {
      return {
        data: await this.product.findMany({
          skip: (page - 1) * 10,
          take: limit,
          where: {
            available: true
          }
  
        }),
        meta:{
          total: totalPage,
          page: page,
          lastPage: lastPage
        }
      }  
    } catch (error) {
      throw new Error ('Error find all products: ' + error.messages);
    }
    
  }

  async findOne(id: number) {
    const producto = await this.product.findUnique({
      where: {id, available: true},
    });  
    
    if(!producto){
      throw new RpcException({
        message: `Producto with id # ${ id } not found`,
        status: HttpStatus.BAD_REQUEST
      })
    }

    return producto;
    
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const {id: __, ...data } = updateProductDto

    await this.findOne(id)

    return this.product.update({
      where : {id},
      data: data
    });
  }
 
  // HARD DELETE
  // async remove(id: number) {
  //   await this.findOne(id)

  //   return this.product.delete({
  //     where : {id}
  //   })
  // }

  async remove(id:number){
    await this.findOne(id)

    const producto = this.product.update({
      where : { id : id },
      data: {
        available: false
      }
    });
    return producto
  }

}

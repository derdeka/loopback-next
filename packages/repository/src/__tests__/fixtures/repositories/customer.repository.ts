// Copyright IBM Corp. 2018,2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Getter, inject} from '@loopback/context';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  HasManyThroughRepositoryFactory,
  juggler,
  repository,
} from '../../..';
import {Customer, Order, Address, Seller} from '../models';
import {OrderRepository} from './order.repository';
import {HasOneRepositoryFactory} from '../../../';
import {AddressRepository} from './address.repository';
import {SellerRepository} from './seller.repository';

export class CustomerRepository extends DefaultCrudRepository<
  Customer,
  typeof Customer.prototype.id
> {
  public readonly orders: HasManyRepositoryFactory<
    Order,
    typeof Customer.prototype.id
  >;
  public readonly address: HasOneRepositoryFactory<
    Address,
    typeof Customer.prototype.id
  >;
  public readonly sellers: HasManyThroughRepositoryFactory<
    Seller,
    Order,
    typeof Customer.prototype.id
  >;

  constructor(
    @inject('datasources.db') protected db: juggler.DataSource,
    @repository.getter('OrderRepository')
    orderRepositoryGetter: Getter<OrderRepository>,
    @repository.getter('AddressRepository')
    addressRepositoryGetter: Getter<AddressRepository>,
    @repository.getter('SellerRepository')
    sellerRepositoryGetter: Getter<SellerRepository>,
  ) {
    super(Customer, db);
    this.orders = this._createHasManyRepositoryFactoryFor(
      'orders',
      orderRepositoryGetter,
    );
    this.address = this._createHasOneRepositoryFactoryFor(
      'address',
      addressRepositoryGetter,
    );
    this.sellers = this.createHasManyThroughRepositoryFactoryFor(
      'sellers',
      sellerRepositoryGetter,
      orderRepositoryGetter,
    );
  }
}

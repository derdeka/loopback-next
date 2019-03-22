// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, hasMany, model, property, hasOne, belongsTo} from '../../..';
import {Order} from './order.model';
import {Address} from './address.model';
import {Seller} from './seller.model';

@model()
export class Customer extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property({
    type: 'string',
  })
  name: string;

  @hasMany(() => Order)
  orders: Order[];

  @hasMany(() => Seller, {through: () => Order})
  sellers: Seller[];

  @hasOne(() => Address)
  address: Address;

  @hasMany(() => Customer, {keyTo: 'parentId'})
  customers?: Customer[];

  @belongsTo(() => Customer)
  parentId?: number;
}

// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity} from '../model';
import {TypeResolver} from '../type-resolver';

export enum RelationType {
  belongsTo = 'belongsTo',
  embedsMany = 'embedsMany',
  embedsOne = 'embedsOne',
  hasMany = 'hasMany',
  hasOne = 'hasOne',
  referencesMany = 'referencesMany',
  referencesOne = 'referencesOne',
}

export interface RelationDefinitionBase {
  /**
   * The type of the relation, must be one of RelationType values.
   */
  type: RelationType;

  /**
   * The relation name, typically matching the name of the accessor property
   * defined on the source model. For example "orders" or "customer".
   */
  name: string;

  /**
   * The source model of this relation.
   *
   * E.g. when a Customer has many Order instances, then Customer is the source.
   */
  source: typeof Entity;

  /**
   * The target model of this relation.
   *
   * E.g. when a Customer has many Order instances, then Order is the target.
   */
  target: TypeResolver<Entity, typeof Entity>;
}

export interface HasManyDefinition extends RelationDefinitionBase {
  type: RelationType.hasMany;

  /**
   * The foreign key used by the target model.
   *
   * E.g. when a Customer has many Order instances, then keyTo is "customerId".
   * Note that "customerId" is the default FK assumed by the framework, users
   * can provide a custom FK name by setting "keyTo".
   */
  keyTo?: string;
}

export interface HasManyThroughDefinition extends RelationDefinitionBase {
  type: RelationType.hasMany;

  /**
   * The through model of this relation.
   *
   * E.g. when a Customer has many Order instances and a Seller has many Order instances,
   * then Order is through.
   */
  through: TypeResolver<Entity, typeof Entity>;

  /**
   * The foreign key used by the through model to reference the source model.
   *
   * E.g. when a Customer has many Order instances and a Seller has many Order instances,
   * then keyTo is "customerId".
   * Note that "customerId" is the default FK assumed by the framework, users
   * can provide a custom FK name by setting "keyTo".
   */
  keyTo?: string;

  /**
   * The foreign key used by the through model to reference the target model.
   *
   * E.g. when a Customer has many Order instances and a Seller has many Order instances,
   * then targetFkName is "sellerId".
   */
  targetFkName?: string;

  /*
   * The primary key in the target model when using through, e.g. Seller#id.
   */
  targetPrimaryKey?: string;
}

export interface BelongsToDefinition extends RelationDefinitionBase {
  type: RelationType.belongsTo;

  /*
   * The foreign key in the source model, e.g. Order#customerId.
   */
  keyFrom: string;

  /*
   * The primary key of the target model, e.g Customer#id.
   */
  keyTo?: string;
}

export interface HasOneDefinition extends RelationDefinitionBase {
  type: RelationType.hasOne;

  /**
   * The foreign key used by the target model.
   *
   * E.g. when a Customer has one Address instance, then keyTo is "customerId".
   * Note that "customerId" is the default FK assumed by the framework, users
   * can provide a custom FK name by setting "keyTo".
   */
  keyTo?: string;
}

/**
 * A union type describing all possible Relation metadata objects.
 */
export type RelationMetadata =
  | BelongsToDefinition
  | HasManyDefinition
  | HasManyThroughDefinition
  | HasOneDefinition
  // TODO(bajtos) add other relation types and remove RelationDefinitionBase once
  // all relation types are covered.
  | RelationDefinitionBase;

// Re-export Getter so that users don't have to import from @loopback/context
export {Getter} from '@loopback/context';

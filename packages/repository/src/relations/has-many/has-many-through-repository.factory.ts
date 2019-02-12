// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as debugFactory from 'debug';
import {camelCase} from 'lodash';
import {DataObject} from '../../common-types';
import {EntityNotFoundError, InvalidRelationError} from '../../errors';
import {Entity} from '../../model';
import {EntityCrudRepository} from '../../repositories/repository';
import {constrainFilter} from '../../repositories/constraint-utils';
import {isTypeResolver} from '../../type-resolver';
import {Getter, HasManyThroughDefinition} from '../relation.types';
import {Where} from '../../query';
import {
  DefaultHasManyThroughRepository,
  HasManyThroughRepository,
} from './has-many-through.repository';

const debug = debugFactory('loopback:repository:has-many-repository-factory');

export type HasManyThroughRepositoryFactory<
  Target extends Entity,
  ForeignKeyType
> = (fkValue: ForeignKeyType) => HasManyThroughRepository<Target>;

/**
 * Enforces a constraint on a repository based on a relationship contract
 * between models. For example, if a Customer model is related to an Order model
 * via a HasMany relation, then, the relational repository returned by the
 * factory function would be constrained by a Customer model instance's id(s).
 *
 * @param relationMetadata The relation metadata used to describe the
 * relationship and determine how to apply the constraint.
 * @param targetRepositoryGetter The repository which represents the target model of a
 * relation attached to a datasource.
 * @returns The factory function which accepts a foreign key value to constrain
 * the given target repository
 */
export function createHasManyThroughRepositoryFactory<
  Target extends Entity,
  TargetID,
  Through extends Entity,
  ThroughID,
  ForeignKeyType
>(
  relationMetadata: HasManyThroughDefinition,
  targetRepositoryGetter: Getter<EntityCrudRepository<Target, TargetID>>,
  throughRepositoryGetter: Getter<EntityCrudRepository<Through, ThroughID>>,
): HasManyThroughRepositoryFactory<Target, ForeignKeyType> {
  const meta = resolveHasManyThroughMetadata(relationMetadata);
  debug('Resolved HasMany relation metadata: %o', meta);
  return function(fkValue?: ForeignKeyType) {
    async function getConstraint(
      targetInstance: Target,
    ): Promise<DataObject<Through> | Where<Through>> {
      // tslint:disable-next-line:no-any
      let constraint: any = {[meta.keyTo]: fkValue};
      if (targetInstance) {
        constraint[meta.targetFkName] =
          targetInstance[meta.targetPrimaryKey as keyof Target];
      } else {
        const throughRepo = await throughRepositoryGetter();
        const throughInstances = await throughRepo.find(
          constrainFilter(undefined, constraint),
        );
        if (!throughInstances.length) {
          const id = 'through constraint ' + JSON.stringify(constraint);
          throw new EntityNotFoundError(throughRepo.entityClass, id);
        }
        constraint = {
          or: throughInstances.map((throughInstance: Through) => {
            return {id: throughInstance[meta.targetFkName as keyof Through]};
          }),
        };
      }
      return constraint as DataObject<Through> | Where<Through>;
    }
    return new DefaultHasManyThroughRepository<
      Target,
      TargetID,
      EntityCrudRepository<Target, TargetID>,
      Through,
      ThroughID,
      EntityCrudRepository<Through, ThroughID>
    >(targetRepositoryGetter, throughRepositoryGetter, getConstraint);
  };
}

type HasManyThroughResolvedDefinition = HasManyThroughDefinition & {
  keyTo: string;
  targetFkName: string;
  targetPrimaryKey: string;
};

/**
 * Resolves given hasMany metadata if target is specified to be a resolver.
 * Mainly used to infer what the `keyTo` property should be from the target's
 * belongsTo metadata
 * @param relationMeta hasMany metadata to resolve
 */
function resolveHasManyThroughMetadata(
  relationMeta: HasManyThroughDefinition,
): HasManyThroughResolvedDefinition {
  if (!isTypeResolver(relationMeta.target)) {
    const reason = 'target must be a type resolver';
    throw new InvalidRelationError(reason, relationMeta);
  }
  if (!isTypeResolver(relationMeta.through)) {
    const reason = 'through must be a type resolver';
    throw new InvalidRelationError(reason, relationMeta);
  }

  if (
    relationMeta.keyTo ||
    relationMeta.targetFkName ||
    relationMeta.targetPrimaryKey
  ) {
    // The explict cast is needed because of a limitation of type inference
    return relationMeta as HasManyThroughResolvedDefinition;
  }

  const sourceModel = relationMeta.source;
  if (!sourceModel || !sourceModel.modelName) {
    const reason = 'source model must be defined';
    throw new InvalidRelationError(reason, relationMeta);
  }

  const targetModel = relationMeta.target();
  debug(
    'Resolved model %s from given metadata: %o',
    targetModel.modelName,
    targetModel,
  );

  const throughModel = relationMeta.through();
  debug(
    'Resolved model %s from given metadata: %o',
    throughModel.modelName,
    throughModel,
  );

  const defaultFkName = camelCase(sourceModel.modelName + '_id');
  const hasDefaultFkProperty =
    throughModel.definition &&
    throughModel.definition.properties &&
    throughModel.definition.properties[defaultFkName];
  if (!hasDefaultFkProperty) {
    const reason = `through model ${
      targetModel.name
    } is missing definition of default foreign key ${defaultFkName}`;
    throw new InvalidRelationError(reason, relationMeta);
  }

  const targetFkName = camelCase(targetModel.modelName + '_id');
  const hasTargetFkName =
    throughModel.definition &&
    throughModel.definition.properties &&
    throughModel.definition.properties[targetFkName];
  if (!hasTargetFkName) {
    const reason = `through model ${
      throughModel.name
    } is missing definition of target foreign key ${targetFkName}`;
    throw new InvalidRelationError(reason, relationMeta);
  }

  const targetPrimaryKey = targetModel.definition.idProperties()[0];
  if (!targetPrimaryKey) {
    const reason = `target model ${
      targetModel.modelName
    } does not have any primary key (id property)`;
    throw new InvalidRelationError(reason, relationMeta);
  }

  return Object.assign(relationMeta, {
    keyTo: defaultFkName,
    targetFkName,
    targetPrimaryKey,
  });
}

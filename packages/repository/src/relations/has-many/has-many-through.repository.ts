// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Getter} from '@loopback/context';
import {Count, DataObject, Options} from '../../common-types';
import {Entity} from '../../model';
import {Filter, Where} from '../../query';
import {
  constrainDataObject,
  constrainFilter,
  constrainWhere,
} from '../../repositories/constraint-utils';
import {EntityCrudRepository} from '../../repositories/repository';
import {AdvancedConstraint} from './has-many-through-repository.factory';

/**
 * CRUD operations for a target repository of a HasMany relation
 */
export interface HasManyThroughRepository<
  Target extends Entity,
  Through extends Entity
> {
  /**
   * Create a target model instance
   * @param targetModelData The target model data
   * @param throughModelData The through model data
   * @param options Options for the operation
   * @param throughOptions Options passed to create through
   * @returns A promise which resolves to the newly created target model instance
   */
  create(
    targetModelData: DataObject<Target>,
    throughModelData?: DataObject<Through>,
    options?: Options,
    throughOptions?: Options,
  ): Promise<Target>;
  /**
   * Find target model instance(s)
   * @param filter A filter object for where, order, limit, etc.
   * @param options Options for the operation
   * @returns A promise which resolves with the found target instance(s)
   */
  find(filter?: Filter<Target>, options?: Options): Promise<Target[]>;
  /**
   * Delete multiple target model instances
   * @param where Instances within the where scope are deleted
   * @param options
   * @returns A promise which resolves the deleted target model instances
   */
  delete(where?: Where<Target>, options?: Options): Promise<Count>;
  /**
   * Patch multiple target model instances
   * @param dataObject The fields and their new values to patch
   * @param where Instances within the where scope are patched
   * @param options
   * @returns A promise which resolves the patched target model instances
   */
  patch(
    dataObject: DataObject<Target>,
    where?: Where<Target>,
    options?: Options,
  ): Promise<Count>;
}

export class DefaultHasManyThroughRepository<
  TargetEntity extends Entity,
  TargetID,
  TargetRepository extends EntityCrudRepository<TargetEntity, TargetID>,
  ThroughEntity extends Entity,
  ThroughID,
  ThroughRepository extends EntityCrudRepository<ThroughEntity, ThroughID>
> implements HasManyThroughRepository<TargetEntity, ThroughEntity> {
  /**
   * Constructor of DefaultHasManyEntityCrudRepository
   * @param getTargetRepository the getter of the related target model repository instance
   * @param constraint the key value pair representing foreign key name to constrain
   * the target repository instance
   */
  constructor(
    public getTargetRepository: Getter<TargetRepository>,
    public getThroughRepository: Getter<ThroughRepository>,
    public getAdvancedConstraint: (
      targetInstance?: TargetEntity,
    ) => Promise<AdvancedConstraint<TargetEntity | ThroughEntity>>,
  ) {}

  async create(
    targetModelData: DataObject<TargetEntity>,
    throughModelData: DataObject<ThroughEntity> = {},
    options?: Options,
    throughOptions?: Options,
  ): Promise<TargetEntity> {
    const targetRepository = await this.getTargetRepository();
    const targetInstance = await targetRepository.create(
      targetModelData,
      options,
    );
    const advancedConstraint = await this.getAdvancedConstraint(targetInstance);
    const throughRepository = await this.getThroughRepository();
    await throughRepository.create(
      constrainDataObject(
        throughModelData,
        advancedConstraint.dataObject as DataObject<ThroughEntity>,
      ),
      throughOptions,
    );
    return targetInstance;
  }

  async find(
    filter?: Filter<TargetEntity>,
    options?: Options,
  ): Promise<TargetEntity[]> {
    const advancedConstraint = await this.getAdvancedConstraint();
    const targetRepository = await this.getTargetRepository();
    return targetRepository.find(
      constrainFilter(filter, advancedConstraint.filter as Filter<
        TargetEntity
      >),
      options,
    );
  }

  async delete(where?: Where<TargetEntity>, options?: Options): Promise<Count> {
    const advancedConstraint = await this.getAdvancedConstraint();
    const targetRepository = await this.getTargetRepository();
    return targetRepository.deleteAll(
      constrainWhere(where, advancedConstraint.where as Where<TargetEntity>),
      options,
    );
  }

  async patch(
    dataObject: DataObject<TargetEntity>,
    where?: Where<TargetEntity>,
    options?: Options,
  ): Promise<Count> {
    const advancedConstraint = await this.getAdvancedConstraint();
    const targetRepository = await this.getTargetRepository();
    return targetRepository.updateAll(
      constrainDataObject(
        dataObject,
        advancedConstraint.dataObject as DataObject<TargetEntity>,
      ),
      constrainWhere(where, advancedConstraint.where as Where<TargetEntity>),
      options,
    );
  }
}

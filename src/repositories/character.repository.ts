import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasOneRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Armor, Character, CharacterRelations, Skill, Weapon} from '../models';
import {ArmorRepository} from './armor.repository';
import {WeaponRepository} from './weapon.repository';
import {SkillRepository} from './skill.repository';


export class CharacterRepository extends DefaultCrudRepository<
  Character,
  typeof Character.prototype.id,
  CharacterRelations
> {

  public armor: HasOneRepositoryFactory<Armor, typeof Character.prototype.id>;

  public weapon: HasOneRepositoryFactory<Weapon, typeof Character.prototype.id>;

  public skill: HasOneRepositoryFactory<Skill, typeof Character.prototype.id>;
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter(ArmorRepository)
    protected armorRepositoryGetter: Getter<ArmorRepository>,
    @repository.getter(WeaponRepository)
    protected weaponRepositoryGetter: Getter<WeaponRepository>,
    @repository.getter(SkillRepository)
    protected skillRepositoryGetter: Getter<SkillRepository>
  ) {
    super(Character, dataSource);
    this.armor = this.createHasOneRepositoryFactoryFor('armor', armorRepositoryGetter);
    this.weapon = this.createHasOneRepositoryFactoryFor('weapon', weaponRepositoryGetter);
    this.skill = this.createHasOneRepositoryFactoryFor('skill', skillRepositoryGetter);
  }
}

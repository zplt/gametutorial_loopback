import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Armor, Character, Skill, Weapon} from '../models';
import {
  WeaponRepository,
  ArmorRepository,
  SkillRepository,
  CharacterRepository,
} from '../repositories';

export class UpdateCharacterController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
    @repository(ArmorRepository)
    public armorRepository: ArmorRepository,
    @repository(WeaponRepository)
    public weaponRepository: WeaponRepository,
    @repository(SkillRepository)
    public skillRepository: SkillRepository,
  ) {
  }

  @patch('/updatecharacter/{id}/weapon', {
    responses: {
      '200': {
        description: 'update weapon',
        content: {'application/json': {schema: Weapon}},
      },
    },
  })
  async updateWeapon(
    @param.path.string('id') id: string,
    @requestBody() weapon: Weapon,
  ): Promise<Weapon> {

    const char: Character = await this.characterRepository.findById(id);
    char.attack! += weapon.attack;
    char.defence! += weapon.defence;

    //unequip old weapon
    const filter: Filter = {where: {'characterId': id}};
    // @ts-ignore
    if ((await this.weaponRepository.find(filter))[0] !== undefined) {
      const oldWeapon: Weapon = await this.characterRepository.weapon(id).get();
      char.attack! -= oldWeapon.attack;
      char.defence! -= oldWeapon.defence;
      await this.characterRepository.weapon(id).delete();
    }
    await this.characterRepository.updateById(id, char);
    return this.characterRepository.weapon(id).create(weapon);
  };


  @patch('/updatecharacter/{id}/armor', {
    responses: {
      '200': {
        description: 'update armor',
        content: {'application/json': {schema: Armor}},
      },
    },
  })
  async updateArmor(
    @param.path.string('id') id: string,
    @requestBody() armor: Armor,
  ): Promise<Armor> {

    const char: Character = await this.characterRepository.findById(id);
    char.attack! += armor.attack;
    char.defence! += armor.defence;

    //unequip old armor
    const filter: Filter = {where: {'characterId': id}};
    // @ts-ignore
    if ((await this.armorRepository.find(filter))[0] !== undefined) {
      const oldArmor: Armor = await this.characterRepository.armor(id).get();
      char.attack! -= oldArmor.attack;
      char.defence! -= oldArmor.defence;
      await this.characterRepository.armor(id).delete();
    }
    await this.characterRepository.updateById(id, char);
    return this.characterRepository.armor(id).create(armor);
  };

  @patch('/updatecharacter/{id}/skill', {
    responses: {
      '200': {
        description: 'update skill',
        content: {'application/json': {schema: Skill}},
      },
    },
  })
  async updateSkill(
    @param.path.string('id') id: string,
    @requestBody() skill: Skill,
  ): Promise<Skill> {
    await this.characterRepository.skill(id).delete();
    return this.characterRepository.skill(id).create(skill);
  }

  @del('/characters/{id}', {
    responses: {
      '204': {
        description: 'Character DELETE succes',
      },
    },
  })
  async deleteById(
    @param.path.string('id') id: string,
  ): Promise<void> {
    //delete all related things
    await this.characterRepository.weapon(id).delete();
    await this.characterRepository.armor(id).delete();
    await this.characterRepository.skill(id).delete();
    //delete character
    await this.characterRepository.deleteById(id);
  }

  @del('/updatecharacter/{id}/weapon', {
    responses: {
      '204': {
        description: 'DELETE Weapon',
      },
    },
  })
  async deleteWeapon(
    @param.path.string('id') id: string,
  ): Promise<void> {
    const filter: Filter = {where: {'characterId': id}};
    // @ts-ignore
    if ((await this.weaponRepository.find(filter))[0] !== undefined) {

      const oldWeapon: Weapon = await this.characterRepository.weapon(id).get();
      const char: Character = await this.characterRepository.findById(id);
      char.attack! -= oldWeapon.attack!;
      char.defence! -= oldWeapon.defence!;

      await this.characterRepository.weapon(id).delete();
      await this.characterRepository.updateById(id, char);
    }

  }

  @del('/updatecharacter/{id}/armor', {
    responses: {
      '204': {
        description: 'DELETE Armor',
      },
    },
  })
  async deleteArmor(
    @param.path.string('id') id: string,
  ): Promise<void> {
    //unequip old armor
    const filter: Filter = {where: {'characterId': id}};
    // @ts-ignore
    if ((await this.armorRepository.find(filter))[0] !== undefined) {
      const oldArmor: Armor = await this.characterRepository.armor(id).get();
      const char: Character = await this.characterRepository.findById(id);
      char.attack! -= oldArmor.attack!;
      char.defence! -= oldArmor.defence!;
      await this.characterRepository.armor(id).delete();
      await this.characterRepository.updateById(id, char);
    }
  }

  @del('/updatecharacter/{id}/skill', {
    responses: {
      '204': {
        description: 'DELETE Skill',
      },
    },
  })
  async deleteSkill(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await this.characterRepository.skill(id).delete();
  }

  @patch('/updatecharacter/{id}/levelup', {
    responses: {
      '200': {
        description: 'level up',
        content: {'application/json': {schema: Character}},
      },
    },
  })
  async levelUp(
    @param.path.string('id') id: string,
  ): Promise<Character> {
    const char: Character = await this.characterRepository.findById(id);
    let levels = 0;
    while (char.currentExp! >= char.nextLevelExp!) {
      levels++;
      char.currentExp! -= char.nextLevelExp!;
      char.nextLevelExp! += 100;
    }
    char.level! += levels;
    char.maxHealt! += 10 * levels;
    char.currentHealth! = char.maxHealt!;
    char.maxMana! += 5 * levels;
    char.currentMana! = char.maxMana!;
    char.attack! += 3 * levels;
    char.defence! += levels;
    await this.characterRepository!.updateById(id, char);
    return char;
  }

}
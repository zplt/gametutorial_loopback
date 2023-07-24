import {belongsTo, Entity, model, property} from '@loopback/repository';
import {v4 as uuid} from 'uuid';
import {Character} from './character.model';

@model()
export class Weapon extends Entity {
  @property({
    type: 'string',
    id: true,
    default:()=>uuid(),
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'number',
    required: true,
  })
  attack: number;

  @property({
    type: 'number',
    required: true,
  })
  defence: number;

  @belongsTo(()=>Character)
  characterId:string

  constructor(data?: Partial<Weapon>) {
    super(data);
  }
}

export interface WeaponRelations {
  // describe navigational properties here
}

export type WeaponWithRelations = Weapon & WeaponRelations;

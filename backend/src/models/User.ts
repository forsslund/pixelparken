export interface User {
  id: string;
  username: string;
  avatar: string;
  createdAt: Date;
}

export interface CreateUserRequest {
  username: string;
  avatar: string;
}

export const AVATARS = [
  '🦊', // Fox
  '🐼', // Panda
  '🦁', // Lion
  '🐨', // Koala
  '🐸', // Frog
  '🦉', // Owl
  '🐙', // Octopus
  '🦄', // Unicorn
  '🐱', // Cat
  '🐶', // Dog
  '🐰', // Rabbit
  '🦝', // Raccoon
  '🐯', // Tiger
  '🐻', // Bear
  '🦊', // Fox
] as const;

export type Avatar = typeof AVATARS[number];

export function isValidAvatar(avatar: string): boolean {
  return AVATARS.includes(avatar as Avatar);
}

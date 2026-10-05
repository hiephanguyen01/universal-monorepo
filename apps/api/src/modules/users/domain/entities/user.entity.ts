import { InvalidUserFullNameError } from "../errors/invalid-user-full-name.error";

import type { Email } from "../value-objects/email.vo";
import { UserId } from "../value-objects/user-id.vo";

export type UserRole = "USER" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface UserProps {
  id: UserId;

  email: Email;

  passwordHash: string;

  fullName: string;

  role: UserRole;

  status: UserStatus;

  createdAt: Date;

  updatedAt: Date;
}

export interface CreateUserProps {
  id: UserId;

  email: Email;

  passwordHash: string;

  fullName: string;

  role?: UserRole;

  now?: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(input: CreateUserProps): User {
    const fullName = User.normalizeFullName(input.fullName);

    const now = input.now ?? new Date();

    return new User({
      id: input.id,

      email: input.email,

      passwordHash: input.passwordHash,

      fullName,

      role: input.role ?? "USER",

      status: "ACTIVE",

      createdAt: now,

      updatedAt: now,
    });
  }

  static restore(props: UserProps): User {
    return new User({
      ...props,
    });
  }

  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  changeFullName(fullName: string): void {
    this.props.fullName = User.normalizeFullName(fullName);

    this.touch();
  }

  block(): void {
    if (this.props.status === "BLOCKED") {
      return;
    }

    this.props.status = "BLOCKED";

    this.touch();
  }

  activate(): void {
    if (this.props.status === "ACTIVE") {
      return;
    }

    this.props.status = "ACTIVE";

    this.touch();
  }

  isActive(): boolean {
    return this.props.status === "ACTIVE";
  }

  private static normalizeFullName(fullName: string): string {
    const normalized = fullName.trim();

    if (normalized.length < 2 || normalized.length > 100) {
      throw new InvalidUserFullNameError();
    }

    return normalized;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}

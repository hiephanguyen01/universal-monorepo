import { InvalidUserFullNameError } from "../errors/invalid-user-full-name.error";

export type UserRole = "USER" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface UserProps {
  id: string;

  email: string;

  passwordHash: string;

  fullName: string;

  role: UserRole;

  status: UserStatus;

  createdAt: Date;

  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static restore(props: UserProps): User {
    return new User({
      ...props,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
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
    const normalized = fullName.trim();

    if (normalized.length < 2 || normalized.length > 100) {
      throw new InvalidUserFullNameError();
    }

    this.props.fullName = normalized;

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

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}

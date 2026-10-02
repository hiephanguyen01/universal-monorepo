export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;

  readonly email: string;

  readonly passwordHash: string;

  readonly fullName: string;

  readonly role: string;

  readonly status: string;

  readonly createdAt: Date;

  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;

    this.email = props.email;

    this.passwordHash = props.passwordHash;

    this.fullName = props.fullName;

    this.role = props.role;

    this.status = props.status;

    this.createdAt = props.createdAt;

    this.updatedAt = props.updatedAt;
  }
}

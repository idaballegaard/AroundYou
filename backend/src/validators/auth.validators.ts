import Joi from "joi";

export type RegisterUserInput = {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
};

export type LoginUserInput = {
  identifier: string;
  password: string;
};

const userRegistrationSchema = Joi.object<RegisterUserInput>({
  firstName: Joi.string().min(2).max(255).required(),
  lastName: Joi.string().min(2).max(255).required(),
  userName: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().min(5).max(255).required(),
  password: Joi.string().min(6).max(30).required(),
});

const userLoginSchema = Joi.object<LoginUserInput>({
  identifier: Joi.string().required(),
  password: Joi.string().min(6).max(30).required(),
});

export function validateUserRegistration(data: unknown) {
  return userRegistrationSchema.validate(data);
}

export function validateUserLogin(data: unknown) {
  return userLoginSchema.validate(data);
}

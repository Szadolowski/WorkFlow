import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsPesel(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPesel',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string' || !/^\d{11}$/.test(value)) {
            return false;
          }
          const weight = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
          let sum = 0;

          for (let i = 0; i < 10; i++) {
            sum += parseInt(value.charAt(i)) * weight[i];
          }

          const checksum = (10 - (sum % 10)) % 10;
          return parseInt(value[10]) === checksum;
        },
      },
    });
  };
}

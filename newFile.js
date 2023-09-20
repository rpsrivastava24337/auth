import encrypt from 'mongoose-encryption';
import { userSchema, secret } from "./app";

userSchema.plugin(encrypt, { secret: secret, encryptedField: ['password'] }); // use encryptedfield to specife which field you like to encrypt


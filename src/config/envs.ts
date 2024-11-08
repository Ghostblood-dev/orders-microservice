
import 'dotenv/config'
import * as joi from 'joi'

interface EnvVars {
    PORT: number;
    ORDER_MICROSERVICES_HOST: string;
    PRODUCT_PORT: number;
    PRODUCT_MICROSERVICES_HOST: string;
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    PRODUCT_PORT: joi.number().required(),
    PRODUCT_MICROSERVICES_HOST: joi.string().required()
}).unknown(true)

const { error, value } = envsSchema.validate(process.env)

if (error) {
    throw new Error(`Config validation error ${error.message}`)
}

const envsVars: EnvVars = value

export const envs = {
    port: envsVars.PORT,
    productPort: envsVars.PRODUCT_PORT,
    productHost: envsVars.PRODUCT_MICROSERVICES_HOST,
}
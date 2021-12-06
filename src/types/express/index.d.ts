import { Request } from "express";
import {JsonToken} from "../token";

export interface IGetUserAuthInfoRequest extends Request {
  user: JsonToken // or any other type
}
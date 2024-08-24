import {finishSCORM, initializeSCORM} from "./scormApi";

export const initializeSCORMWrapper = () => {
  return initializeSCORM();
};

export const finishSCORMWrapper = () => {
  return finishSCORM();
};
declare module "app-info-parser" {
  export default class AppInfoParser {
    constructor(file: string | File | Buffer);
    parse(): Promise<any>;
  }
}

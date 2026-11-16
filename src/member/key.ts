/**
 * 管理员开通工具的公钥（V5.3）。公钥可以公开，只能用来核对开通码；
 * 生成开通码要用私钥，私钥只在管理员自己的开通工具里，不在 APP 和代码仓库里。
 * 换了私钥（例如开通工具丢了）要重新打包 APP。
 */
import { decodeBase64 } from './code';

export const ADMIN_PUBLIC_KEY_B64 = 'PhlU+xSnIdHPYaJrDs5ZR/k6XYhGd13H7nl7m7QTzbk=';
export const ADMIN_PUBLIC_KEY = decodeBase64(ADMIN_PUBLIC_KEY_B64);

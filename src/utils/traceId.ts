/*
 * @Author: 璐 Lu.xu@brandsh.cn
 * @Date: 2025-03-26 11:50:23
 * @LastEditors: 璐 Lu.xu@brandsh.cn
 * @LastEditTime: 2025-03-26 12:04:53
 * @FilePath: /pixpro/service/utils/traceId.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { TRACEIDIMF } from "./cache/constants";
import { localCache } from "./cache/index";
export function setTraceID() {
  //先判断localStorage中是否有traceID或者是否过期
  let traceImf = localCache.getCache(TRACEIDIMF);
  /* 有traceID */
  if (traceImf) {
    if (traceImf.expireTime <= Date.now()) {
      //已过期,重新生成一个
      traceImf = creatTraceIDImf();
    } else {
      // 没有过期，每次调用都更新一下过期时间
      traceImf.expireTime = getExpireTime();
    }
  } else {
    /* 没有traceID,新生成一个存入本地 */
    traceImf = creatTraceIDImf();
  }
  // 将traceID存储到localCache中
  localCache.setCache(TRACEIDIMF, traceImf);

  return traceImf.traceID;
}

function creatTraceIDImf() {
  const traceID = `${generateRandomId(10)}-${new Date().getTime()}`;
  const expireTime = getExpireTime();
  const traceImf = {
    traceID,
    expireTime,
  };
  console.log("traceImf2", traceImf);
  return traceImf;
}

function getExpireTime(minutes = 20) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes); // 增加20分钟
  const timestamp = now.getTime(); // 获取时间戳
  return timestamp;
}

function generateRandomId(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

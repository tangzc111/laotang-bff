// biome-ignore-all lint/complexity/noStaticOnlyClass: false positive
import type Koa from 'koa';
import type { Logger } from 'log4js';

class ErrorHandler {
  static error(app: Koa, logger: Logger) {
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (e) {
        logger.error(e);

        // 设置状态码
        ctx.status = 500;
        // 构造错误信息
        const errorMessage = e.stack;

        // 使用 ctx.render 渲染 500 页面
        await ctx.render('500', { errorMessage });
      }
    });
    app.use(async (ctx, next) => {
      await next();
      if (ctx.status !== 404) {
        return;
      }
      await ctx.render('404');
    });
  }
}
export default ErrorHandler;

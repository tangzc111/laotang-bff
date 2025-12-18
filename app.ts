import 'dotenv/config';
import { addAliases } from 'module-alias';

addAliases({
  '@root': __dirname,
  '@interfaces': `${__dirname}/interface`,
  '@config': `${__dirname}/config`,
  '@middlewares': `${__dirname}/middlewares`,
});

import config from '@config/index';
import render from '@koa/ejs';
import ErrorHandler from '@middlewares/ErrorHandler';
import { asValue, createContainer, Lifetime } from 'awilix';
import { loadControllers, scopePerRequest } from 'awilix-koa';
import koa from 'koa';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import historyApiFallback from 'koa2-connect-history-api-fallback';
import { configure, getLogger } from 'log4js';
import { getPrismaReadClient, getPrismaWriteClient } from './services/prisma.service';

// Allow self-signed certificates when explicitly configured
if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' || process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = new koa();
// 日志系统
configure({
  appenders: { cheese: { type: 'file', filename: `${__dirname}/logs/lt.log` } },
  categories: { default: { appenders: ['cheese'], level: 'error' } },
});
const { port, viewDir, memoryFlag, staticDir } = config;
// 解析请求体，确保路由可以从 ctx.request.body 读取数据
app.use(bodyParser());
// 静态资源
app.use(serve(staticDir));
// 创建容器
const container = createContainer();

//注册 Prisma Client 到容器
container.register({
  prismaWriteClient: asValue(getPrismaWriteClient()),
  prismaReadClient: asValue(getPrismaReadClient()),
});

// 所有的可以被注入的代码都在container中
container.loadModules([`${__dirname}/services/*{.ts,.js}`], {
  formatName: 'camelCase',
  resolverOptions: {
    // 1.每次都 new
    // 2.单例模式
    lifetime: Lifetime.SCOPED,
  },
});

// 把路由和容器进行关联
app.use(scopePerRequest(container));
render(app, {
  root: viewDir,
  layout: false,
  viewExt: 'html',
  cache: memoryFlag,
  debug: false,
});
//除去api 以外的路由 全部映射回index.html 让前端路由来处理
app.use(historyApiFallback({ index: '/', whiteList: ['/api'] }));
// 错误处理
const logger = getLogger('cheese');
ErrorHandler.error(app, logger);
// 把所有的路由全部 load 进来
app.use(loadControllers(`${__dirname}/routers/*{.ts,.js}`));

// 本地或服务器常驻进程都需要主动监听端口（Serverless 场景除外）
if (process.env.SERVERLESS !== 'true') {
  app.listen(port || 3000, () => {
    console.log(`Server is running on port ${port}`);
  });
}
export default app;

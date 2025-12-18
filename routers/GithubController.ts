import { GET, route } from 'awilix-koa';
import type { Context } from 'koa';
import type GithubService from '../services/github.service';

@route('/api/github')
class GithubController {
  private githubService: GithubService;

  constructor({ githubService }: { githubService: GithubService }) {
    this.githubService = githubService;
  }

  @GET()
  @route('/profile')
  async getProfile(ctx: Context) {
    const tokenFromHeader = ctx.get('authorization');
    const tokenFromQuery = ctx.query.token;
    const token = tokenFromHeader?.replace(/Bearer\s+/i, '') || (typeof tokenFromQuery === 'string' ? tokenFromQuery : '');

    if (!token) {
      ctx.status = 400;
      ctx.body = { code: -1, message: 'GitHub token is required. Provide Authorization header or token query param.' };
      return;
    }

    try {
      const profile = await this.githubService.getAuthenticatedUser(token);
      ctx.body = { code: 0, data: profile, message: 'Success' };
    } catch (error) {
      ctx.status = 502;
      ctx.body = { code: -1, message: error instanceof Error ? error.message : 'Failed to fetch GitHub profile' };
    }
  }
}

export default GithubController;

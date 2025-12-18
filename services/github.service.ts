export type GithubUserProfile = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url: string;
  html_url: string;
  bio?: string | null;
  email?: string | null;
  company?: string | null;
  location?: string | null;
  blog?: string | null;
  [key: string]: unknown;
};

class GithubService {
  private apiBase = 'https://api.github.com';

  async getAuthenticatedUser(token: string): Promise<GithubUserProfile> {
    const response = await fetch(`${this.apiBase}/user`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'laotang-bff',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const fallbackMessage = `GitHub API request failed with status ${response.status}`;
      let errorMessage = fallbackMessage;

      try {
        const errorBody = await response.json();
        if (errorBody && typeof errorBody.message === 'string') {
          errorMessage = errorBody.message;
        }
      } catch {
        errorMessage = fallbackMessage;
      }

      if (response.status === 401) {
        throw new Error('GitHub token is invalid or expired');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }
}

export default GithubService;

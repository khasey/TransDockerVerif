import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-42';

@Injectable()

export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
	super({
	  clientID: 'u-s4t2ud-43e7f3ab58a9c2f54f3921a0c9381829a810f46506d21456966a423d144b9934',
	  clientSecret: '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',
	  callbackURL: `${process.env.NEXT_PUBLIC_API_URL_CALLBACK}`,
	  scope: 'public',
	});
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
	const { id, username, emails } = profile;

	// Récupération de la réponse brute
	const rawResponse = JSON.parse(profile._raw);

	// Extraction de l'URL de l'image de profil
	const imageUrl = rawResponse.image?.link || null;

	const user = {
	  imageUrl,
	  accessToken,
	  refreshToken,
	  id,
	  username,
	  emails,
	};

	console.log('user =', user);

	done(null, user);
  }
}
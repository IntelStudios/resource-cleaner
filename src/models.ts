import { setObjValue } from './json-util';

export interface ITranslateRequest {
	lang: string;
	object: any;
	path: string[];
	original: string;
}

export interface ITranslationObject {
	object: any,
	file: string;
	isChange: boolean;
}


export interface ResourceReferences {
	unused: Set<string>;
}



export class TranslateData {
	requests: ITranslateRequest[] = [];
	objects: ITranslationObject[] = [];
	constructor() {

	}


	setTranslation(request: ITranslateRequest, translation: string) {
		throw 'Unknown method to set translation';
	}
}

export class ResxTranslateData extends TranslateData {

	setTranslation(request: ITranslateRequest, translation: string) {
		if (!request.object.root.data) {
			request.object.root.data = [];
		}
		const item = request.object.root.data.find((item: any) => item.name === request.path[0]);
		if (item) {
			item.value = translation;
		}
		else {
			request.object.root.data.push({ _Attribs: { name: request.path[0], 'xml:space': 'preserve' }, value: translation });
		}
	}
}

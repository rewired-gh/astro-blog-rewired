export class TotalOrderedSet<T> {
	private _existedWeights: Set<number>;
	private _orderedElements: {
		value: T;
		weight: number;
	}[];

	constructor() {
		this._existedWeights = new Set();
		this._orderedElements = [];
	}

	private _findIndexForInsert(weight: number): number {
		let low = 0;
		let high = this._orderedElements.length;

		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			if (this._orderedElements[mid].weight < weight) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		return low;
	}

	private _findIndexForRemove(weight: number): number {
		let low = 0;
		let high = this._orderedElements.length - 1;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			if (this._orderedElements[mid].weight === weight) {
				return mid;
			} else if (this._orderedElements[mid].weight < weight) {
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}
		return -1;
	}

	insert(value: T, weight: number) {
		if (this._existedWeights.has(weight)) {
			return -1;
		}
		const index = this._findIndexForInsert(weight);
		this._orderedElements.splice(index, 0, { value, weight });
		this._existedWeights.add(weight);
		return index;
	}

	remove(value: T, weight: number) {
		if (!this._existedWeights.has(weight)) {
			return -1;
		}
		const index = this._findIndexForRemove(weight);
		this._orderedElements.splice(index, 1);
		this._existedWeights.delete(weight);
		return index;
	}

	get(index: number) {
		return this._orderedElements[index]?.value;
	}
}

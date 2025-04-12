import {forEachLine} from "@/utils";
import {Seed} from "../../libs/oracle/src/core/seed";
import {oracleDig, oracleOpen} from "../../libs/oracle/src/oracle-utils";
import EventEmitter from "events";

class Block extends EventEmitter {
	constructor() {
		super();

		this.index = null;
		this.dig = null;
		this.open = null;
	}

	apply(index, dig, open) {
		if (this.index !== index || this.dig !== dig || this.open !== open) {
			this.index = index;
			this.dig = dig;
			this.open = open;

			this.emit("changed");
		}
	}
}

class Field extends EventEmitter {
	constructor(num) {
		super();

		this.size = num;

		this.index = null;
		this.blocks = [];
		for (let i = 0; i < num; ++i) {
			this.blocks.push(new Block(i));
		}
	}

	updateField(index, data) {
		const from = index * this.size;
		for (let i = 0; i < this.size; ++i) {
			const blockIndex = from + i;
			const block = this.blocks[i];
			block.apply(blockIndex, data.dig[blockIndex] || null, data.open[blockIndex] || null);
		}

		if (this.index !== index) {
			this.index = index;

			this.emit("changed");
		}
	}

	updateBlock(index, data) {
		const blockIndex = index % this.size;
		this.blocks[blockIndex].apply(index, data.dig[index] || null, data.open[index] || null);
	}
}

class FieldController extends EventEmitter {

	constructor() {
		super();
		this.field = new Field(64);
		this.originalOracle = null;
		this.originalHistory = null;
		this.numFields = 0;
		this.reset();
	}

	reset() {
		this.oracle = null;
		this.seed = null;
		this.salt = null;
		this.history = null;

		this.blocks = {
			dig: {},
			open: {},
		};
	}

	apply(container) {
		this.reset();

		this.originalOracle = container.oracle.copy();
		this.originalHistory = container.history;
		this.oracle = this.originalOracle.copy();
		this.numFields = Math.floor(this.oracle.attempts / this.field.size);

		this.#applyHistory(container.history);
		this.select(0);
	}

	applyHistory(history) {
		this.reset();
		this.oracle = this.originalOracle.copy();
		this.#applyHistory(history);
		this.select(this.field.index);
	}

	resetToOriginal() {
		this.applyHistory(this.originalHistory);
		this.emit("changed");
	}

	#applyHistory(history) {
		forEachLine(history, (line, index) => {
			if (index === 0) {
				this.seed = Seed.make(line);
				this.history = line;
			} else {
				const split = line.split(" ");
				if (split.length !== 2) {
					throw new Error("Wrong history line: " + line);
				}

				const command = split[0];
				if (command === "salt") {
					this.salt = split[1];
				} else if (command === "dig") {
					const block = parseInt(split[1]);
					this.dig(block);
				} else if (command === "open") {
					const block = parseInt(split[1]);
					this.open(block);
				} else {
					throw new Error("Wrong history line: " + line);
				}
			}
		});
	}

	select(fieldIndex) {
		if (fieldIndex < 0) {
			fieldIndex = 0;
		}

		if (fieldIndex >= this.numFields) {
			fieldIndex = this.numFields - 1;
		}

		this.field.updateField(fieldIndex, this.blocks);
	}

	dig(index) {
		const digData = this.blocks.dig[index] || null;
		if (digData) {
			return;
		}

		this.history += `\ndig ${index}`;
		const payload = oracleDig(index, this.oracle, this.seed, this.salt);
		this.blocks.dig[index] = {
			data: payload.data,
			empty: payload.empty,
			chest: payload.hasOpenAction,
		};

		this.field.updateBlock(index, this.blocks);

		this.emit("changed");
	}

	open(index) {
		const digData = this.blocks.dig[index] || null;
		const openData = this.blocks.open[index] || null;
		if (!digData || !digData.chest || openData) {
			return;
		}

		this.history += `\nopen ${index}`;
		const payload = oracleOpen(index, this.oracle, this.seed, this.salt);

		this.blocks.open[index] = {
			data: payload.data,
			empty: payload.empty
		};

		this.field.updateBlock(index, this.blocks);

		this.emit("changed");
	}
}

const fieldController = new FieldController();

export default fieldController;
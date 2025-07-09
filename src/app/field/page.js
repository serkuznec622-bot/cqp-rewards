"use client";

import styles from './page.module.css';
import {useEffect, useRef, useState} from "react";
import fieldController from "@/controllers/field-controller";

const unitRate = {
	USDT: 1e6,
	TON: 1e9,
};

function BrowserBlock({ data }) {
	const [ content, setContent ] = useState(null);
	const [ status, setStatus ] = useState(null);
	const [ hasSuper, setHasSuper ] = useState(false);
	const [ hasJackpot, setHasJackpot ] = useState(false);

	function onClick() {
		if (data.dig === null) {
			fieldController.dig(data.index);
		} else if (data.dig.chest && !data.open) {
			fieldController.open(data.index);
		}
	}

	function onChanged() {
		if (data.dig === null) {
			setContent(null);
			setStatus("closed");
		} else {
			if (data.dig.chest) {
				if (data.open === null) {
					setContent(null);
					setStatus("chest")
				} else {
					setContent(data.open.data);
					setStatus("opened")
				}
			} else {
				setContent(data.dig.data);
				setStatus("digged");
			}
		}

		setHasSuper(data.open?.data?.super || false);
		setHasJackpot(data.open?.data?.jackpot || false);
	}

	useEffect(() => {
		onChanged();
		data.on("changed", onChanged);

		return () => {
			data.off("changed", onChanged);
		}
	}, []);

	function Content({ }) {
		if (content) {
			if (content.value === 1) {
				return <>
					{content.key}
				</>
			}

			let value = content.value;
			if (unitRate[content.key]) {
				value = (value / unitRate[content.key]).toFixed(2);
			}

			return <>
				<div>{content.key}</div>
				<div>{value}</div>
			</>;
		}
	}

	if (status) {
		return <button className={styles.block + " " + styles["block_" + status] + " " + (hasSuper ? styles.block_super : "") + " " + (hasJackpot ? styles.block_jackpot : "")} onClick={onClick}>
			<Content />
		</button>
	}
}

function Navigation({}) {
	const [ index, setIndex ] = useState(1);
	const inputRef = useRef(null);

	function onChanged() {
		setIndex(fieldController.field.index + 1);
	}

	useEffect(() => {
		onChanged();
		fieldController.field.on("changed", onChanged);

		return () => {
			fieldController.field.off("changed", onChanged);
		}
	}, []);

	function updateIndex(value) {
		if (value === "") {
			setIndex(value);
		} else {
			value = String(value).replaceAll(/[^0-9]+/g, "");
			value = parseInt(value);

			if (value <= 0) {
				value = 1;
			} else if (value > fieldController.numFields) {
				value = fieldController.numFields;
			}

			if (Number.isInteger(value)) {
				setIndex(value);
			}
		}
	}

	function left(e) {
		fieldController.select(fieldController.field.index - 1);
	}

	function right(e) {
		fieldController.select(fieldController.field.index + 1);
	}

	function submit(e) {
		e.preventDefault();
		inputRef.current.blur();
		fieldController.select(index - 1);
	}

	return <div className={styles.navigation}>
		<button className={styles.navigation_button} onClick={left}>
			{"<"}
		</button>
		<form onSubmit={submit}>
			<input inputMode="numeric" className={styles.navigation_input} value={index.toString()} onChange={(e) => updateIndex(e.target.value)} ref={inputRef}/>
		</form>
		<button className={styles.navigation_button} onClick={right}>
			{">"}
		</button>
	</div>;
}

function Tools({}) {


	function onReset() {
		stopFind();

		fieldController.resetToOriginal();
		fieldController.select(0);
	}

	function onOpenField() {
		stopFind();

		let from = fieldController.field.index * fieldController.field.size;
		for(let i = 0; i < fieldController.field.size; i++) {
			const blockIndex = from + i;
			fieldController.dig(blockIndex);
			fieldController.open(blockIndex);
		}
	}

	let finderTimeoutId = null;

	function stopFind() {
		clearTimeout(finderTimeoutId);
		finderTimeoutId = null;
	}

	function startFind(first = true) {
		finderTimeoutId = setTimeout(() => {
			for (let i = 0; i < 10; i++) {
				const result = find(first);
				if (!result) {
					stopFind();
					return;
				}
				first = false;
			}

			startFind(false);
		}, 0);
	}

	function find(first) {
		if (!first) {
			fieldController.select(fieldController.field.index + 1);
		}

		onOpenField();

		let hasPrize = false;
		for (let i = 0; i < fieldController.field.blocks.length; i++) {
			const block = fieldController.field.blocks[i];
			const hasSuper = block.open?.data?.super || false;
			const hasJackpot = block.open?.data?.jackpot || false;

			if (hasSuper || hasJackpot) {
				hasPrize = true;
			}
		}

		if (hasPrize && first) {
			hasPrize = false;
		}

		const hasNext = fieldController.field.index < fieldController.numFields - 1;
		return hasNext && !hasPrize;
	}

	function onFindPrize() {
		if (finderTimeoutId !== null) {
			stopFind();
		} else {
			startFind();
		}
	}

	return <div className={styles.tools}>
		<button className={styles.tools_button} onClick={onReset}>
			RESET
		</button>
		<button className={styles.tools_button} onClick={onOpenField}>
			OPEN FIELD
		</button>
		<button className={styles.tools_button} onClick={onFindPrize}>
			NEXT PRIZE
		</button>
	</div>;
}

function History() {
	const [history, setHistory] = useState("");
	const [show, setShow] = useState(false);
	const ref = useRef(null);

	let setTimeoutId = null;

	function onChanged() {
		clearTimeout(setTimeoutId);
		setTimeoutId = setTimeout(() => {
			setHistory(fieldController.history);
		}, 200);
	}

	function onUpdated(e) {
		setHistory(e.target.value);
	}

	useEffect(() => {
		onChanged();
		fieldController.on("changed", onChanged);

		return () => {
			fieldController.off("changed", onChanged);
		}
	}, []);

	useEffect(() => {
		if (ref.current) {
			ref.current.scrollTop = ref.current.scrollHeight;
		}
	}, [ history ]);

	function onCopy(e) {
		navigator.clipboard.writeText(fieldController.history);
	}

	function onReload() {
		fieldController.applyHistory(ref.current.value);
	}

	function onShow() {
		setShow(true);
	}

	function onHide() {
		setShow(false);
	}

	function TextArea() {
		if (show) {
			return <>
				<textarea className={styles.history_textarea} value={history} onChange={onUpdated} ref={ref}></textarea>
				<button className={styles.history_button} onClick={onReload}>
					RELOAD
				</button>
				<button className={styles.history_button} onClick={onCopy}>
					COPY
				</button>
				<button className={styles.history_button} onClick={onHide}>
					HIDE HISTORY
				</button>
			</>
		}

		return <>
			<div className={styles.spacer}></div>
			<button className={styles.history_button} onClick={onCopy}>
				COPY
			</button>
			<button className={styles.history_button} onClick={onShow}>
				SHOW HISTORY
			</button>
		</>
	}

	return <div className={styles.history_container}>
		<TextArea/>
	</div>
}

function Browser({ cycle }) {
	let array = [];
	for (let i = 0; i < fieldController.field.size; i++) {
		array.push(<BrowserBlock key={i} data={fieldController.field.blocks[i]}/>);
	}

	function onBack() {
		window.location.reload();
	}

	return <>
		<button className={styles.back} onClick={onBack}>
			{"<< BACK"}
		</button>
		<div className={styles.browser_content}>
			<div className={styles.spacer}></div>
			<div className={styles.browser_hello}>
				Each opened block deterministically affects the entire game, so no one knows where the super prize is hidden! But it DEFINITELY exists on the field! <b>Check for yourself!</b>
			</div>
			<div className={styles.browser}>
				<div className={styles.spacer}></div>
				<div className={styles.field_container}>
					<div className={styles.field}>
						{array}
					</div>
					<Navigation/>
					<Tools/>
				</div>
				<div className={styles.spacer}></div>
				<History/>
			</div>
			<div className={styles.spacer}></div>
			<Attention visible={cycle === "cycle-current"}/>
		</div>
	</>
}

function BrowserLoader({cycle}) {
	const [ready, setReady] = useState(false);
	const [error, setError] = useState(null);

	async function load() {
		try {
			const imp = await import('../../cycles/' + cycle);
			const container = await imp.get();
			fieldController.apply(container);
			setReady(true);
		} catch (e) {
			console.error(e);
			setError(e);
		}
	}

	useEffect(() => {
		load();
	}, []);

	if (error) {
		return <Error error={error} />
	}

	if (ready) {
		return <Browser cycle={cycle} />
	}

	return <Loader />;
}

function Loader() {
	return <div className={styles.loader}>LOADING...</div>;
}

function Error({ error }) {
	return <div className={styles.loader}>ERROR: {error.message}</div>;
}

function Attention({ visible = true, ref }) {
	return <div className={styles.attention} ref={ref} style={{ opacity: visible ? 1 : 0 }}>
		<p>
			<b>Attention!</b> Information about the <b>current cycle</b> is provided without the <b>starting seed</b> to prevent the possibility of finding the super prize in the original game unfairly.
		</p>
		<p>
			The history and <b>starting seed</b> of the current cycle will be available in this program after the cycle ends in the <b>original game</b>.
		</p>
		<p>
			This program is provided for informational purposes only, allowing users to familiarize themselves with the number of rewards and the reward distribution algorithm in the original game!
		</p>
	</div>
}

function Selector({ onSelected }) {
	const ref = useRef(null);
	const attentionRef = useRef(null);

	function simulate() {
		onSelected(ref.current.value);
	}

	function onChanged() {
		if (ref.current.value === "cycle-current") {
			attentionRef.current.style.opacity = 1;
		} else {
			attentionRef.current.style.opacity = 0;
		}
	}

	useEffect(() => {
		onChanged();
	}, []);

	return <div className={styles.selector_content}>
		<div className={styles.spacer}></div>
		<div className={styles.selector_container}>
			<select id="select" className={styles.selector_control} ref={ref} onChange={onChanged}>
				<option value="cycle-current">CURRENT CYCLE</option>
				<option value="cycle-1">CYCLE 1</option>
				<option value="cycle-2">CYCLE 2</option>
				<option value="cycle-3">CYCLE 3</option>
				<option value="cycle-4">CYCLE 4</option>
				<option value="cycle-5">CYCLE 5</option>
				<option value="cycle-6">CYCLE 6</option>
				<option value="cycle-7">CYCLE 7</option>
				<option value="cycle-8" disabled>CYCLE 8</option>
				<option value="cycle-9" disabled>CYCLE 9</option>
			</select>
			<button className={styles.selector_button} onClick={simulate}>
				SIMULATE
			</button>
		</div>
		<div className={styles.spacer}></div>
		<Attention ref={attentionRef}/>
	</div>;
}

export default function Page() {
	const [ cycle, setCycle ] = useState(null);

	function onSelected(value) {
		setCycle(value);
	}

	if (cycle === null) {
		return <>
			<Selector onSelected={onSelected}/>
		</>;
	}

	return <>
		<BrowserLoader cycle={cycle} />
	</>;
}
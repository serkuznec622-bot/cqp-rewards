"use client";

import styles from './page.module.css';
import {runOracleTest} from "../../../libs/oracle/test/oracle-test-functions";
import {useEffect, useState} from "react";

function Test() {
	const [ready, setReady] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		runOracleTest().then(() => {
			setReady(true);
		}).catch(error => {
			setError(error);
		});
	}, []);

	if (error) {
		return <div className={styles.message}>Test error: {error.message}</div>
	}

	if (ready) {
		return <div className={styles.message}>All test passed!</div>
	}

	return <div className={styles.message}>Test in progress...</div>
}

export default function Page() {
	return <Test />;
}
import {makeOracleInstanceV5} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV5(),
		history: await fetchAsText("/history/cycle-5.txt")
	}
}
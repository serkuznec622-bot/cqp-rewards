import {makeOracleInstanceV7} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV7(),
		history: await fetchAsText("/history/cycle-7.txt")
	}
}
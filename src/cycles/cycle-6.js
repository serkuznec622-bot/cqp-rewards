import {makeOracleInstanceV6} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV6(),
		history: await fetchAsText("/history/cycle-6.txt")
	}
}
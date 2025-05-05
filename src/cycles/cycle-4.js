import {makeOracleInstanceV4} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV4(),
		history: await fetchAsText("/history/cycle-4.txt")
	}
}
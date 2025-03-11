import {makeOracleInstanceV1} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV1(),
		history: await fetchAsText("/history/cycle-1.txt")
	}
}
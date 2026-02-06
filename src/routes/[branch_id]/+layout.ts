import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params }) => {
	return {
		branchId: params.branch_id
	};
};

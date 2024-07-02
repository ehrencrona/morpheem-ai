import { apiCall } from '../../api-call';

export async function deleteUserExercise(id: number): Promise<void> {
	return apiCall(`/api/user-exercises/${id}`, {
		method: 'DELETE'
	});
}

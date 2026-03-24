<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'content' => ['required_without:attachments', 'nullable', 'string', 'max:4096'],
            'message_type' => ['nullable', Rule::in(['text', 'image', 'document', 'audio', 'video'])],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240'], // max 10MB per file
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'content.required_without' => 'Pesan atau attachment harus diisi.',
            'content.max' => 'Pesan maksimal 4096 karakter.',
            'attachments.max' => 'Maksimal 5 file attachment.',
            'attachments.*.max' => 'Ukuran file maksimal 10MB.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Default message type to text
        if (!$this->has('message_type')) {
            $this->merge(['message_type' => 'text']);
        }
    }
}

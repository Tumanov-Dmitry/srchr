import { Button } from "@/components/ui/button"
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select"

type AdminStatusFormProps = {
  action: (formData: FormData) => void | Promise<void>
  id: string
  name?: string
  defaultValue: string
  options: FormSelectOption[]
  hidden?: Record<string, string>
  submitLabel?: string
}

export function AdminStatusForm({
  action,
  id,
  name = "status",
  defaultValue,
  options,
  hidden,
  submitLabel = "Сохранить",
}: AdminStatusFormProps) {
  return (
    <form action={action} className="flex min-w-64 items-center gap-2">
      <input name="id" type="hidden" value={id} />
      {Object.entries(hidden ?? {}).map(([key, value]) => (
        <input key={key} name={key} type="hidden" value={value} />
      ))}
      <FormSelect
        className="h-9 min-w-36"
        defaultValue={defaultValue}
        name={name}
        options={options}
      />
      <Button size="sm" type="submit">
        {submitLabel}
      </Button>
    </form>
  )
}

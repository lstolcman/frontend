import React from 'react'
import { Button, Typography } from '@material-ui/core'
import Form from 'react-standalone-form'
import {
  Input,
  FormButton,
  Select,
  Checkbox,
  FormActions,
} from 'react-standalone-form-mui'
import CoordinatesInput from './CoordinatesInput'
import HintWrapper from './HintWrapper'
import Text from './Text'
import locationTypes from '../utils/locationTypes'


const LocationForm = ({
  locationData,
  onSubmitLocation,
  updateCurrentMarker,
  cancel,
  isNew,
}) => {
  const [loading, setLoading] = React.useState()
  const [hasWater, setHasWater] = React.useState()
  const [hasFire, setHasFire] = React.useState()

  const { lat, lon } = locationData.location
  const locationToString = [lat, lon]
    .toString()
    .replace(',', ', ')

  return <>
    <Typography variant='h4' gutterBottom>
      <Text id={`markerForm.heading.${isNew ? 'addMarker' : 'editMarker'}`} />
    </Typography>
    <Form
      fields={[
        'name',
        'description',
        'directions',
        'type',
        'location',
        'water_exists',
        'water_comment',
        'fire_exists',
        'fire_comment',
      ]}
      required={[
        'name',
        'description',
        'directions',
        'type',
        'location',
      ]}
      callbackOnChange={fields => {
        setHasWater(fields.water_exists)
        setHasFire(fields.fire_exists)
      }}
    >

      <HintWrapper message={<Text id='markerForm.placeHint' />}>
        <Input
          name='name'
          label={<Text id='markerForm.place' />}
          min={5}
          initialValue={locationData && locationData.name}
        />
      </HintWrapper>

      <HintWrapper message={<Text id='markerForm.descriptionHint' />}>
        <Input
          name='description'
          label={<Text id='markerForm.description' />}
          min={40}
          initialValue={locationData && locationData.description}
          multiline
        />
      </HintWrapper>

      <HintWrapper message={<Text id='markerForm.directionsHint' />}>
        <Input
          name='directions'
          label={<Text id='locationInfo.directions' />}
          min={20}
          initialValue={locationData && locationData.directions}
          multiline
        />
      </HintWrapper>

      <HintWrapper message={<Text id='markerForm.typeHint' />}>
        <Select
          name='type'
          label={<Text id='markerForm.type' />}
          options={Object.entries(locationTypes).map(([value, label]) => {
            return { value, label: <Text id={label} /> }
          })}
          initialValue={locationData && locationData.type}
        />
      </HintWrapper>

      <HintWrapper message={<Text id='markerForm.locationHint' />}>
        <CoordinatesInput
          name='location'
          label={<Text id='markerForm.location' />}
          initialValue={locationData && locationToString}
          onChange={value => {
            updateCurrentMarker(value)
          }}
        />
      </HintWrapper>

      <Checkbox
        name='water_exists'
        text={<Text id='locationInfo.waterAccess' />}
        initialValue={locationData && locationData.water_exists}
      />

      {hasWater &&
        <HintWrapper message={<Text id='markerForm.waterDescriptionHint' />}>
          <Input
            name='water_comment'
            label={<Text id='markerForm.waterDescription' />}
            min={40}
            initialValue={locationData && locationData.water_comment}
            multiline
          />
        </HintWrapper>
      }

      <Checkbox
        name='fire_exists'
        text={<Text id='locationInfo.fireAccess' />}
        initialValue={locationData && locationData.fire_exists}
      />

      {hasFire &&
        <HintWrapper message={<Text id='markerForm.fireDescriptionHint' />}>
          <Input
            name='fire_comment'
            label={<Text id='markerForm.fireDescription' />}
            min={40}
            initialValue={locationData && locationData.fire_comment}
            multiline
          />
        </HintWrapper>
      }

      <FormActions>
        <Button onClick={() => cancel()}><Text id='cancel' /></Button>
        <FormButton
          variant='contained'
          color='primary'
          callback={async fields => {
            setLoading(true)
            await onSubmitLocation(fields)
            setLoading(false)
          }}
          loading={loading}
        ><Text id='save' /></FormButton>
      </FormActions>
    </Form>
  </>
}

export default LocationForm

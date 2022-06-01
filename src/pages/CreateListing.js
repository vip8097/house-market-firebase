import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Layout from '../components/Layout/Layout';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { AiOutlineFileAdd } from 'react-icons/ai';
import { toast } from 'react-toastify';

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db } from '../firebase.config';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const CreateListing = () => {
  const [loading, setLoading] = useState(false);
  const [geoLoactionEnable, setGeoLoactionEnable] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    latitude: 0,
    longitude: 0,
  });
  // formData Destructuring
  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking, // eslint-disable-line
    furnished, // eslint-disable-line
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    latitude,
    longitude,
  } = formData;
  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        setFormData({
          ...formData,
          useRef: user.uid,
        });
      });
    } else {
      navigate('/signin');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Spinner />;
  }
  // mutate function
  const onChangeHandler = (e) => {
    let boolean = null;
    if (e.target.value === 'true') {
      boolean = true;
    }
    if (e.target.value === 'false') {
      boolean = false;
    }

    // files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }

    //text/booleans/number
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  //form submit
  const onSubmit = async (e) => {
    e.preventDefault();
    // console.table(formData);
    if (discountedPrice >= regularPrice) {
      setLoading(false);
      toast.error('Discount Price should be les than Regular Price');
      return;
    }
    if (images > 6) {
      setLoading(false);
      toast.error('Max 6 image can be selected');
      return;
    }

    let geoLocation = {};
    let location; // eslint-disable-line
    if (geoLoactionEnable) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyAlsxp8CDXxMuDY3FmSykTN7w0a1bZ7t-s`
      );
      const data = await response.json(); // eslint-disable-line
      // console.table(data);
    } else {
      geoLocation.lat = latitude;
      geoLocation.lng = longitude;
      // location = address
    }

    // store images to firebase storage function
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
        const storageRef = ref(storage, 'images/' + fileName);
        const uploadTask = uploadBytesResumable(storageRef, image);
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.table('upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                // console.table('upload is paused');
                break;
              case 'running':
                // console.table('upload is running');
                break;
              default:
                break;
            }
          },
          (error) => {
            reject(error);
          },
          //success
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };
    const imgUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() => {
      setLoading(false);
      toast.error('Images is not uploaded');
      return;
    });

    // console.log(imgUrls);

    // save from data function
    const formDataCopy = {
      ...formData,
      imgUrls,
      geoLocation,
      timestamp: serverTimestamp(),
    };
    formData.location = address;
    delete formDataCopy.images;
    // not used Google map remoove this line code(delete formData.address )
   
    !formDataCopy.offer && delete formDataCopy.discountedPrice;
    const docRef = await addDoc(collection(db, 'listings'), formDataCopy);
    toast.success('Listing Created!');
    setLoading(false);
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  };
  return (
    <Layout>
      <div className="container d-flex flex-column align-items-center justify-content-center mb-4">
        <h3 className="mt-3 w-50 bg-dark text-light p-2 text-center">
          Create Listing &nbsp;
          <AiOutlineFileAdd />
        </h3>

        {/* sell rent button */}
        <form className="w-50 bg-light p-4" onSubmit={onSubmit}>
          <div className="d-flex flex-row mt-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                value="rent"
                onChange={onChangeHandler}
                name="type"
                id="type"
              />
              <label className="form-check-label" htmlFor="rent">
                Rent
              </label>
            </div>

            <div className="form-check ms-3">
              <input
                className="form-check-input"
                type="radio"
                value="sale"
                onChange={onChangeHandler}
                name="type"
                id="type"
              />
              <label className="form-check-label" htmlFor="sale">
                Sale
              </label>
            </div>
          </div>

          {/* name */}
          <div className="mb-3 mt-4">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={name}
              onChange={onChangeHandler}
              required
            />
          </div>

          {/* bedrooms */}
          <div className="mb-3 mt-4">
            <label htmlFor="name" className="form-label">
              Bedrooms
            </label>
            <input
              type="number"
              className="form-control"
              id="bedrooms"
              value={bedrooms}
              onChange={onChangeHandler}
              required
            />
          </div>

          {/* bathrooms */}
          <div className="mb-3 mt-4">
            <label htmlFor="name" className="form-label">
              Bathrooms
            </label>
            <input
              type="number"
              className="form-control"
              id="bathrooms"
              value={bathrooms}
              onChange={onChangeHandler}
              required
            />
          </div>
          {/* parking */}
          <div className="mb-3 ">
            <label htmlFor="parking" className="form-label">
              Parking :
            </label>
            <div className="d-flex flex-row ">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  value={true}
                  onChange={onChangeHandler}
                  name="parking"
                  id="parking"
                />
                <label className="form-check-label" htmlFor="yes">
                  Yes
                </label>
              </div>
              <div className="form-check ms-3">
                <input
                  className="form-check-input"
                  type="radio"
                  value={false}
                  onChange={onChangeHandler}
                  name="parking"
                  id="parking"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="no">
                  No
                </label>
              </div>
            </div>
          </div>

          {/* furnished */}

          <div className="mb-3 ">
            <label htmlFor="furnished" className="form-label">
              Furnished :
            </label>
            <div className="d-flex flex-row ">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  value={true}
                  onChange={onChangeHandler}
                  name="furnished"
                  id="furnished"
                />
                <label className="form-check-label" htmlFor="yes">
                  Yes
                </label>
              </div>
              <div className="form-check ms-3">
                <input
                  className="form-check-input"
                  type="radio"
                  value={false}
                  onChange={onChangeHandler}
                  name="furnished"
                  id="furnished"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="no">
                  No
                </label>
              </div>
            </div>
          </div>

          {/* address */}
          <div className="mb-3 ">
            <label htmlFor="address"> Address : </label>

            <textarea
              className="form-control"
              placeholder="Enter Your Address"
              id="address"
              value={address}
              onChange={onChangeHandler}
              required
            />
          </div>

          {/* geoLoaction */}
          {!geoLoactionEnable && (
            <div className="mb-3 ">
              <div className="d-flex flex-row ">
                <div className="form-check">
                  <label className="form-check-label" htmlFor="yes">
                    Latitude
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    value={latitude}
                    onChange={onChangeHandler}
                    name="latitude"
                    id="latitude"
                  />
                </div>
                <div className="form-check ms-3">
                  <label className="form-check-label" htmlFor="no">
                    Longitude
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    name="longitude"
                    value={longitude}
                    onChange={onChangeHandler}
                    id="longitude"
                  />
                </div>
              </div>
            </div>
          )}

          {/* offers */}

          <div className="mb-3 ">
            <label htmlFor="offer" className="form-label">
              Offer :
            </label>
            <div className="d-flex flex-row ">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  value={true}
                  onChange={onChangeHandler}
                  name="offer"
                  id="offer"
                />
                <label className="form-check-label" htmlFor="yes">
                  Yes
                </label>
              </div>
              <div className="form-check ms-3">
                <input
                  className="form-check-input"
                  type="radio"
                  value={false}
                  defaultChecked
                  onChange={onChangeHandler}
                  name="offer"
                  id="offer"
                />
                <label className="form-check-label" htmlFor="no">
                  No
                </label>
              </div>
            </div>
          </div>

          {/* regular price */}

          <div className="mb-3 mt-4">
            <label htmlFor="name" className="form-label">
              Regular Price :
            </label>
            <div className="d-flex flex-row">
              <input
                type="number"
                className="form-control w-50"
                id="regularPrice"
                name="regularPrice"
                value={regularPrice}
                onChange={onChangeHandler}
                required
              />

              {type === 'rent' && <p className="ms-4 mt-2">$ / Month</p>}
            </div>
          </div>

          {/* offer */}
          {offer && (
            <div className="mb-3 mt-4">
              <label htmlFor="discountedPrice" className="form-label">
                Discounted Price :
              </label>

              <input
                type="number"
                className="form-control w-50"
                id="discountedPrice"
                name="discountedPrice"
                value={discountedPrice}
                onChange={onChangeHandler}
                required
              />
            </div>
          )}

          {/* files images etc  */}
          <div className="mb-3 ">
            <label htmlFor="formFile" className="form-label">
              select images:
            </label>

            <input
              type="file"
              className="form-control "
              id="images"
              name="images"
              onChange={onChangeHandler}
              max="6"
              accept=".jpg, .png,.jpeg"
              multiple
              required
            />
          </div>

          {/* submit button */}
          <div className="mb-3">
            <input
              disabled={!name || !address || !regularPrice || !images}
              className="btn btn-primary w-100"
              type="submit"
              value="Create Listing"
            />
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateListing;

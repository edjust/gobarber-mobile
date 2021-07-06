import React, { useCallback, useRef } from 'react';
import {
    Image,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import ImagePicker from 'react-native-image-picker';
import Input from '../../components/Input';
import Button from '../../components/Button';
import getValidationErrors from '../../utils/getValidationErrors';
import api from '../../services/api';
import {
    Container,
    Title,
    BackButton,
    UserAvatarButton,
    UserAvatar,
} from './styles';
import { useAuth } from '../../hooks/auth';

interface ProfileFormData {
    name: string;
    email: string;
    password: string;
    old_password: string;
    password_confirmation: string;
}

const Profile: React.FC = () => {
    const navigation = useNavigation();
    const { user, updateUser } = useAuth();

    const formRef = useRef<FormHandles>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const oldPasswordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    const handleSignUp = useCallback(
        async (data: ProfileFormData) => {
            try {
                console.log(data);
                formRef.current?.setErrors({});

                const schema = Yup.object().shape({
                    name: Yup.string().required('Nome obrigatório'),
                    email: Yup.string()
                        .required('E-mail obrigatório')
                        .email('Digite um e-mail válido'),
                    old_password: Yup.string(),
                    password: Yup.string().when('old_password', {
                        is: (val: string) => !!val.length,
                        then: Yup.string().required('Campo obrigatório'),
                        otherwise: Yup.string(),
                    }),
                    password_confirmation: Yup.string()
                        .when('old_password', {
                            is: (val: string) => !!val.length,
                            then: Yup.string().required('Campo obrigatório'),
                            otherwise: Yup.string(),
                        })
                        .oneOf(
                            [Yup.ref('password'), null],
                            'Confirmação incorreta',
                        ),
                });

                console.log(schema);
                await schema.validate(data, {
                    abortEarly: false,
                });

                const {
                    name,
                    email,
                    old_password,
                    password,
                    password_confirmation,
                } = data;

                const formData = {
                    name,
                    email,

                    ...(old_password
                        ? {
                              old_password,
                              password,
                              password_confirmation,
                          }
                        : {}),
                };

                const response = await api.put('/profile', formData);

                console.log(response);

                updateUser(response.data);

                Alert.alert('Perfil atualizado com sucesso!');

                navigation.goBack();
            } catch (err) {
                if (err instanceof Yup.ValidationError) {
                    const errors = getValidationErrors(err);

                    formRef.current?.setErrors(errors);

                    return;
                }

                Alert.alert(
                    'Erro na atualização do perfil',
                    'Ocorreu um erro ao atualizar o seu perfil, tente novamente',
                );
            }
        },
        [navigation, updateUser],
    );

    const handleUpdateAvatar = useCallback(() => {
        ImagePicker.showImagePicker(
            {
                title: 'Selecione um Avatar',
                cancelButtonTitle: 'Cancelar',
                takePhotoButtonTitle: 'Usar câmera',
                chooseFromLibraryButtonTitle: 'Escolher da galeria',
            },
            response => {
                if (response.didCancel) {
                    return;
                }
                if (response.error) {
                    Alert.alert('Erro ao atualizar seu avatar');
                    return;
                }

                const source = { uri: response.uri };

                const data = new FormData();

                data.append('avatar', {
                    type: 'image/jpeg',
                    name: `${user.id}.jpg`,
                    uri: response.uri,
                });

                api.patch('/users/avatar', data).then(apiResponse => {
                    updateUser(apiResponse.data);
                });

                // You can also display the image using data:
                // const source = { uri: 'data:image/jpeg;base64,' + response.data };
            },
        );
    }, [updateUser, user.id]);

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                enabled
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flex: 1 }}
                >
                    <Container>
                        <BackButton onPress={handleGoBack}>
                            <Icon
                                name="chevron-left"
                                size={24}
                                color="#999591"
                            />
                        </BackButton>
                        <UserAvatarButton onPress={handleUpdateAvatar}>
                            <UserAvatar source={{ uri: user.avatar_url }} />
                        </UserAvatarButton>
                        <View>
                            <Title>Meu perfil</Title>
                        </View>

                        <Form
                            initialData={user}
                            ref={formRef}
                            onSubmit={handleSignUp}
                        >
                            <Input
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    emailInputRef.current?.focus();
                                }}
                                name="name"
                                icon="user"
                                placeholder="Nome"
                            />

                            <Input
                                ref={emailInputRef}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    oldPasswordInputRef.current?.focus();
                                }}
                                name="email"
                                icon="mail"
                                placeholder="E-mail"
                            />

                            <Input
                                ref={oldPasswordInputRef}
                                secureTextEntry
                                textContentType="newPassword"
                                returnKeyType="next"
                                containerStyle={{ marginTop: 16 }}
                                onSubmitEditing={() =>
                                    passwordInputRef.current?.focus()
                                }
                                name="old_password"
                                icon="lock"
                                placeholder="Senha atual"
                            />

                            <Input
                                ref={passwordInputRef}
                                secureTextEntry
                                textContentType="newPassword"
                                returnKeyType="next"
                                onSubmitEditing={() =>
                                    confirmPasswordInputRef.current?.focus()
                                }
                                name="password"
                                icon="lock"
                                placeholder="Nova senha"
                            />

                            <Input
                                ref={confirmPasswordInputRef}
                                secureTextEntry
                                textContentType="newPassword"
                                returnKeyType="send"
                                onSubmitEditing={() =>
                                    formRef.current?.submitForm()
                                }
                                name="password_confirmation"
                                icon="lock"
                                placeholder="Confirmar senha"
                            />

                            <Button
                                onPress={() => formRef.current?.submitForm()}
                            >
                                Confirmar mudanças
                            </Button>
                        </Form>
                    </Container>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

export default Profile;
